import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../../../generated/prisma/client';

/** 当前管理员 profile；字段与 AppClient `http_profile` mapping 对齐。 */
export class AdminUserProfileDto {
  @ApiProperty({ description: '管理员 ID' })
  id!: number;

  @ApiProperty({
    description: '外部账号 employeeId（字符串化 id，供 AppClient authConfig mapping）',
  })
  employeeId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ description: '昵称（与 username 相同）' })
  nickName!: string;

  @ApiProperty({ enum: AdminRole })
  role!: AdminRole;

  @ApiProperty({ description: '账号是否可用' })
  active!: boolean;

  @ApiProperty()
  mustChangePassword!: boolean;
}
