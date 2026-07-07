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
  agentMetadata?: unknown;
  responseProfile?: unknown;
};

export type ToolBuildContext = {
  userId: number;
  allowedToolIds: number[];
  /** 单次 run 预热的 userIntegration 凭证，避免每次 HTTP tool 查库。 */
  integrationCredentialCache?: ReadonlyMap<string, string>;
};

/** 下游 HTTP 响应源数据（未经过 responseProfile 投影）。 */
export type ToolHttpResponseSource = {
  ok: boolean;
  status: number;
  statusText: string;
  /** 响应 body 原始文本 */
  bodyText: string;
  /** JSON.parse 结果；非 JSON 时为原字符串 */
  bodyParsed: unknown;
};

export type ToolExecutionResult = {
  toolId: number;
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  latency: number;
  /** 下游 HTTP body 原文，或 invoke 阶段原始错误文本。 */
  responseSource?: unknown;
  httpResponse?: ToolHttpResponseSource;
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
