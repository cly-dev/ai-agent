import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LlmModelKind } from '../../../generated/prisma/client';
import { UpdateIntentRecallConfigDto } from './dto/update-intent-recall-config.dto';
import { UpdateLlmModelConfigDto } from './dto/update-llm-model-config.dto';
import { UpsertLlmModelConfigDto } from './dto/upsert-llm-model-config.dto';
import { LlmModelConfigService } from './llm-model-config.service';

@ApiTags('llm-model-config')
@ApiBearerAuth()
@Controller('llm-model-config')
export class LlmModelConfigController {
  constructor(private readonly service: LlmModelConfigService) {}

  @Get()
  @ApiOperation({ summary: '列出全部 LLM / Embedding 配置（同 kind 可多条）' })
  @ApiResponse({ status: 200 })
  findAll() {
    return this.service.findAll();
  }

  @Get('kind/:kind')
  @ApiOperation({ summary: '按 kind 查询配置列表（enabled=true 优先）' })
  @ApiParam({ name: 'kind', enum: LlmModelKind })
  findByKind(@Param('kind') kind: LlmModelKind) {
    return this.service.findByKind(kind);
  }

  @Post()
  @ApiOperation({ summary: '新增一条模型配置（同 kind 可多条）' })
  create(@Body() body: UpsertLlmModelConfigDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: '按 id 更新模型配置' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLlmModelConfigDto,
  ) {
    return this.service.update(id, body);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: '激活指定模型配置（同 kind 仅一条启用）' })
  @ApiParam({ name: 'id', type: Number })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.activate(id);
  }

  @Get('intent-recall')
  @ApiOperation({ summary: '获取意图召回配置' })
  getIntentRecall() {
    return this.service.getIntentRecallConfig();
  }

  @Put('intent-recall')
  @ApiOperation({ summary: '更新意图召回配置' })
  updateIntentRecall(@Body() body: UpdateIntentRecallConfigDto) {
    return this.service.updateIntentRecallConfig(body);
  }
}
