import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ description: '登录邮箱', example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '登录密码', example: 'pass123456' })
  @IsString()
  @MinLength(6)
  password!: string;
}
