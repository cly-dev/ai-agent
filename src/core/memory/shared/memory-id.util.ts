import { BadRequestException } from '@nestjs/common';

/** 会话对外 id：32 位 hex（与创建会话时 `randomBytes(16).toString('hex')` 一致） */
const SESSION_CONTEXT_ID_HEX = /^[a-f0-9]{32}$/;

export function assertPositiveIntId(field: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
}

export function assertSessionContextId(field: string, value: string): void {
  const v = value.trim();
  if (!SESSION_CONTEXT_ID_HEX.test(v)) {
    throw new BadRequestException(
      `${field} must be a 32-character lowercase hex string`,
    );
  }
}
