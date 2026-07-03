import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '../../../../generated/prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination';

const ADMIN_USER_ORDER_BY_FIELDS = [
  'id',
  'email',
  'username',
  'role',
  'createdAt',
] as const;

export type AdminUserOrderByField = (typeof ADMIN_USER_ORDER_BY_FIELDS)[number];

export class QueryAdminUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '管理员 ID（精确）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ description: '关键词：匹配 email / username' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: AdminRole })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: ADMIN_USER_ORDER_BY_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn(ADMIN_USER_ORDER_BY_FIELDS)
  orderBy?: AdminUserOrderByField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
