import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

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

  @ApiPropertyOptional({ description: '角色 ID（用于权限控制）', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  roleId?: number;
}
