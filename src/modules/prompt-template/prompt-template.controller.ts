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
import { CreatePromptTemplateVersionDto } from './dto/create-prompt-template-version.dto';
import { QueryPromptTemplateDto } from './dto/query-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { PromptTemplateService } from './prompt-template.service';

@ApiTags('prompt-template')
@ApiBearerAuth()
@Controller('prompt-template')
export class PromptTemplateController {
  constructor(private readonly service: PromptTemplateService) {}

  @Get('keys')
  @ApiOperation({ summary: '可新建版本的系统 key 列表（不可自定义 key）' })
  listCreatableKeys() {
    return this.service.listCreatableKeys();
  }

  @Get()
  @ApiOperation({ summary: '分页查询提示词模板（含历史版本）' })
  findPage(@Query() query: QueryPromptTemplateDto) {
    return this.service.findPage(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '按 ID 查询提示词模板' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '新建提示词版本（可选 publish 立即发布）' })
  @ApiResponse({ status: 201 })
  createVersion(@Body() body: CreatePromptTemplateVersionDto) {
    return this.service.createVersion(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '编辑提示词版本',
    description:
      '可改 content / title / description / category；不可改 key、作用域与版本。已启用版本保存后立即同步 Redis',
  })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePromptTemplateDto,
  ) {
    return this.service.update(id, body);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布指定版本（同 key/作用域 仅一条 active）' })
  @ApiParam({ name: 'id', type: Number })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.service.publish(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除提示词版本',
    description:
      '仅可删除未启用（isActive=false）的历史版本；同一 key+作用域至少保留一条版本',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
