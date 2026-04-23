import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserType } from '../../../../generated/prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: '用户邮箱',
    example: 'alice@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: '新密码（会加密存储）',
    example: 'new-pass123456',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: '用户名', example: 'alice-new' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: '用户类型（C 端用户/ B 端业务用户）',
    enum: UserType,
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({
    description: '业务角色（用于 Tool 子集授权）',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  userRole?: UserRole;
}
