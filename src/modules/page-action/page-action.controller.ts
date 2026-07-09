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
  CreatePageActionDto,
  QueryPageActionDto,
  QueryPageActionRunDto,
  QueryPageScopeOptionsDto,
  UpdatePageActionDto,
} from './dto/page-action.dto';
import { PageActionService } from './page-action.service';

@ApiTags('page-action')
@ApiBearerAuth()
@Controller()
export class PageActionController {
  constructor(private readonly service: PageActionService) {}

  @Post('page-action')
  @ApiOperation({
    summary: 'B 端：创建 PageAction',
    description:
      'hostToolId 始终可选。分析类可不绑；填入类绑 HostTool；绑 Workflow 时 push 节点优先用 nodes[].input.hostToolId。',
  })
  create(@Body() body: CreatePageActionDto) {
    return this.service.create(body);
  }

  @Patch('page-action/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：更新 PageAction' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePageActionDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete('page-action/:id')
  @AdminRoles(AdminRole.OPERATOR)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'B 端：删除 PageAction（需 OPERATOR / SUPER_ADMIN）',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get('page-action/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'B 端：PageAction 详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('page-action/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: 'B 端：分页查询 App 下 PageAction' })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryPageActionDto,
  ) {
    return this.service.findPage({ ...query, appClientId });
  }

  @Get('page-action/page-scopes/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({
    summary: 'B 端：获取 App 下全部 pageScope（下拉选项）',
    description:
      '主数据来自 HostPage.scope；合并 PageAction 已使用但未登记的 scope。默认仅含启用中的 HostPage。',
  })
  listPageScopes(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryPageScopeOptionsDto,
  ) {
    return this.service.listPageScopes(appClientId, query);
  }

  @Get('page-action/run/by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number })
  @ApiOperation({ summary: 'B 端：分页查询 PageActionRun 运行记录' })
  findRunPageAdmin(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QueryPageActionRunDto,
  ) {
    return this.service.findRunPageAdmin(appClientId, query);
  }

  @Get('page-action/run/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'B 端：PageActionRun 详情（含运行步骤 steps）',
    description: '与 GET page-action/run/detail/:id 相同。',
  })
  findRunAdminById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRunAdmin(id);
  }

  @Get('page-action/run/detail/:id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({
    summary: 'B 端：PageActionRun 详情（含运行步骤 steps）',
    description: '与 GET page-action/run/:id 相同（保留兼容路径）。',
  })
  findRunAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRunAdmin(id);
  }
}
