import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '用户邮箱（用于登录）',
    example: 'alice@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: '用户登录密码（服务端会加密存储）',
    example: 'pass123456',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ description: '用户名', example: 'alice' })
  @IsString()
  username!: string;

  @ApiPropertyOptional({
    description: '用户 token（可选）',
    example: 'custom-user-token',
  })
  @IsOptional()
  @IsString()
  token?: string;
}
