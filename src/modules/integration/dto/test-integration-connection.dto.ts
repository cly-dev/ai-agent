import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

/** 探测集成 baseUrl 是否可访问（创建前或未落库时 baseUrl 必填） */
export class TestIntegrationConnectionDto {
  @ApiPropertyOptional({
    description: '覆盖库中的 baseUrl；创建前探测时必填',
    example: 'https://api.example.com',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'baseUrl must be a valid http(s) URL' })
  baseUrl?: string;

  @ApiPropertyOptional({
    description: '覆盖库中的系统 apiKey，用于带 Authorization 探测',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;
}

/** 未关联 Integration ID 时直接传 baseUrl 探测 */
export class TestIntegrationConnectionByUrlDto extends TestIntegrationConnectionDto {
  @ApiProperty({
    description: '待探测的 API 根地址',
    example: 'https://api.example.com',
  })
  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'baseUrl must be a valid http(s) URL' })
  baseUrl!: string;
}
