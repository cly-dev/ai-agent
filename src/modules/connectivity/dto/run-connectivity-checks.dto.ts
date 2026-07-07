import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { ConnectivityCheckTarget } from '../connectivity.types';

const ALL_TARGETS: ConnectivityCheckTarget[] = [
  'database',
  'redis',
  'llm_chat',
  'llm_embedding',
];

export class RunConnectivityChecksDto {
  @ApiPropertyOptional({
    enum: ALL_TARGETS,
    isArray: true,
    description: '未指定时检测全部基础设施项',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ALL_TARGETS, { each: true })
  targets?: ConnectivityCheckTarget[];
}
