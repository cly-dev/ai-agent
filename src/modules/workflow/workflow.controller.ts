import {
  Body,
  Controller,
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
import {
  CreateWorkflowDto,
  QueryWorkflowDto,
  UpdateWorkflowDto,
} from './dto/workflow.dto';
import { WorkflowService } from './workflow.service';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';

@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: 'B 端：创建 Workflow' })
  create(@Body() body: CreateWorkflowDto) {
    return this.service.create(body);
  }

  @Get('presets/catalog')
  @ApiOperation({
    summary: 'B 端：Workflow 场景 Preset 目录（保存时展开为 nodes[]）',
  })
  listPresets(@Query('profile') profile?: WorkflowProfile) {
    return this.service.listPresets(profile);
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: 'B 端：分页查询 App 下 Workflow' })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryWorkflowDto,
  ) {
    return this.service.findPage({ ...query, appClientId });
  }

  @Get(':id/revisions')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：Workflow revision 历史' })
  listRevisions(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Number.parseInt(limit, 10) : 20;
    return this.service.listRevisions(id, Number.isFinite(parsed) ? parsed : 20);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：更新 Workflow（nodes 变更会递增 version）' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkflowDto,
  ) {
    return this.service.update(id, body);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：Workflow 详情（含绑定与引用计数）' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
