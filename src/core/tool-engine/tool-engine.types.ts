import type { DynamicStructuredTool } from '@langchain/core/tools';
import type {
  HttpMethod,
  IntegrationAuthMode,
} from '../../../generated/prisma/client';
import type { ToolDefinitionInput } from './tool-schema.util';

export type { ToolDefinitionInput };

/** 运行期执行 tool HTTP 所需的最小集成信息（启动时加载，避免每次 invoke 查库）。 */
export type ToolIntegrationDefinition = {
  id: number;
  name: string;
  baseUrl: string;
  authMode: IntegrationAuthMode;
  apiKey: string | null;
};

export type ToolExecutionDefinition = ToolDefinitionInput & {
  method: HttpMethod;
  path: string;
  timeout: number | null;
  integration: ToolIntegrationDefinition;
};

export type ToolBuildContext = {
  userId: number;
  allowedToolIds: number[];
};

export type ToolExecutionResult = {
  toolId: number;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  latency: number;
};

/** 管理端调试 tool HTTP 调用的完整结果 */
export type ToolDebugResult = {
  ok: boolean;
  toolId: number;
  toolName: string;
  method: string;
  url: string;
  durationMs: number;
  request: {
    headers: Record<string, string>;
    body: string | null;
  };
  response?: {
    status: number;
    statusText: string;
    body: string;
    data: unknown;
  };
  error?: string;
};

export type ToolDebugOptions = {
  parameters?: Record<string, unknown>;
  headers?: Record<string, string>;
  apiKey?: string;
  timeoutMs?: number;
};

/** LangChain tool 实例集合，供 bindTools 与 invoke 共用。 */
export type BuiltLangChainTools = {
  tools: DynamicStructuredTool[];
  byName: Map<string, DynamicStructuredTool>;
};
