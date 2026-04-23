import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAppClientDto {
  @ApiProperty({ description: '业务系统名称', example: 'crm-system' })
  @IsString()
  name!: string;

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
