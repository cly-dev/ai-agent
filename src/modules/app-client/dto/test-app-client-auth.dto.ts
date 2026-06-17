import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TestAppClientAuthDto {
  @ApiProperty({
    description: '待校验的业务系统账号 token（与 C 端 x-account-token 相同）',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @MinLength(1)
  accountToken!: string;
}
