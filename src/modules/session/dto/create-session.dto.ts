import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSessionDto {
  @ApiPropertyOptional({
    description: 'Session ID（可选；不传则自动生成 32 位十六进制）',
    example: '1f8a4b2c9d0e11a2b3c4d5e6f7a8b9c0',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: '用户 ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiPropertyOptional({ description: 'Agent ID（可选）', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agentId?: number;

  @ApiPropertyOptional({ description: '会话标题', example: '订单问题咨询' })
  @IsOptional()
  @IsString()
  title?: string;
}
