import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '../../../../generated/prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ description: '管理员邮箱', example: 'ops@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '管理员用户名', example: 'ops-admin' })
  @IsString()
  username!: string;

  @ApiProperty({ description: '管理员角色', enum: AdminRole })
  @IsEnum(AdminRole)
  role!: AdminRole;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
