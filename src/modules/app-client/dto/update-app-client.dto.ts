import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({
    description:
      '外部账号鉴权配置（JSON）。传 null 可清空并回退 APP_CLIENT_HOST 环境变量。',
    example: {
      provider: 'http_profile',
      http: {
        baseUrl: 'https://admin.example.com',
        profilePath: '/account/seller/account/current',
        method: 'GET',
        tokenPlacement: 'authorization_bearer',
        mapping: {
          employeeId: 'employeeId',
          email: 'email',
          username: 'nickName',
          nickName: 'nickName',
          cnName: 'cnName',
          active: 'active',
        },
      },
      autoBindRoleName: 'operator',
      propagateTokenToIntegrations: true,
    },
  })
  @IsOptional()
  @IsObject()
  authConfig?: Record<string, unknown> | null;
}
