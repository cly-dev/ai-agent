export class AgentEntity {
  id?: number;
  appClientId: number;

  // 基本信息
  name: string;
  description?: string;

  // 核心行为定义
  systemPrompt: string;

  // 能力范围
  toolIds: number[];

  // 执行控制
  maxSteps: number;
  enableToolCall: boolean;

  // 扩展配置
  config?: {
    memory?: {
      enabled: boolean;
      maxMessages: number;
    };
    fallbackReply?: string;
  };

  createdAt?: Date;
}
