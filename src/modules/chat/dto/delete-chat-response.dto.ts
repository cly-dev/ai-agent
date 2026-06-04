import { ApiProperty } from '@nestjs/swagger';

export class DeleteChatResponseDto {
  @ApiProperty({ description: '已删除的会话 ID（32 位 hex）' })
  sessionId!: string;
}
