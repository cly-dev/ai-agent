import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChatDto {
  @ApiPropertyOptional({ description: '会话标题' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string | null;

  @ApiPropertyOptional({ description: '关联 Agent ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agentId?: number | null;
}
