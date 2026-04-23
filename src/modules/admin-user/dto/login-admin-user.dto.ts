import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginAdminUserDto {
  @ApiProperty({ description: '管理员登录邮箱', example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '管理员登录密码', example: 'strong-pass-123' })
  @IsString()
  @MinLength(5)
  password!: string;
}
