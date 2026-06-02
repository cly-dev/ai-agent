import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LlmModelKind } from '../../../generated/prisma/client';
import { UpdateIntentRecallConfigDto } from './dto/update-intent-recall-config.dto';
import { UpsertLlmModelConfigDto } from './dto/upsert-llm-model-config.dto';
import { LlmModelConfigService } from './llm-model-config.service';

@ApiTags('llm-model-config')
@ApiBearerAuth()
@Controller('llm-model-config')
export class LlmModelConfigController {
  constructor(private readonly service: LlmModelConfigService) {}

  @Get()
  @ApiOperation({ summary: '列出全部 LLM / Embedding 配置（按 kind 唯一）' })
  @ApiResponse({ status: 200 })
  findAll() {
    return this.service.findAll();
  }

  @Get('kind/:kind')
  @ApiOperation({ summary: '按 kind 查询配置' })
  @ApiParam({ name: 'kind', enum: LlmModelKind })
  findByKind(@Param('kind') kind: LlmModelKind) {
    return this.service.findByKind(kind);
  }

  @Put()
  @ApiOperation({ summary: '按 kind 创建或更新配置' })
  upsert(@Body() body: UpsertLlmModelConfigDto) {
    return this.service.upsertByKind(body);
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
