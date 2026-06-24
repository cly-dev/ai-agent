/** 写确认 pending 存储抽象，避免 session-run 直接依赖 modules/chat。 */
export abstract class WriteConfirmationPort {
  abstract clear(sessionId: string): Promise<void>;
}
