import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSessionDto {
  @ApiPropertyOptional({ description: '用户 ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Agent ID（可选）', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number | null;

  @ApiPropertyOptional({ description: '会话标题', example: '订单问题咨询' })
  @IsOptional()
  @IsString()
  title?: string | null;
}
