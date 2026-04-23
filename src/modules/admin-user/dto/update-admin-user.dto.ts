import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '../../../../generated/prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: '管理员邮箱', example: 'ops@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '管理员用户名', example: 'ops-admin' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '管理员密码', example: 'strong-pass-123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: '管理员角色', enum: AdminRole })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
