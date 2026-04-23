import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserType } from '../../../../generated/prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '用户邮箱（用于登录）',
    example: 'alice@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '用户名', example: 'alice' })
  @IsString()
  username!: string;

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
