import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

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
    description: '工号（业务系统唯一标识）；未传时系统自动生成',
    example: 'YT20220217',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;
}
