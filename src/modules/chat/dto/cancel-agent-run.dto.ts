import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CancelAgentRunDto {
  @ApiPropertyOptional({
    description: '要取消的 AgentRun id；缺省取消当前 session 正在执行的 run',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  runId?: number;
}

export class CancelAgentRunResponseDto {
  @ApiProperty()
  superseded!: boolean;

  @ApiProperty()
  generation!: number;

  @ApiPropertyOptional({ nullable: true })
  cancelledRunId!: number | null;
}
