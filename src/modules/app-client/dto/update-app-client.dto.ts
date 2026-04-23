import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAppClientDto {
  @ApiPropertyOptional({ description: '业务系统名称', example: 'crm-system' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '业务系统描述',
    example: 'CRM business application',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
