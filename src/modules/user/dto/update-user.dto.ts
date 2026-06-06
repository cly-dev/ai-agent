import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../../generated/prisma/client';
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
    description: '账号状态：ACTIVE=启用，DISABLED=禁用',
    enum: UserStatus,
    example: UserStatus.DISABLED,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
