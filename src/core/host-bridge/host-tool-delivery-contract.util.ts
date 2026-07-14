import type { HostToolDecisionDefinition } from './host-tool-decision.types';
import {
  HOST_TOOL_STRING_ARG_KEYS,
  pickHostToolStringArgKey,
} from './host-tool-string-arg.util';

/**
 * Host Tool 交付契约：由 argsSchema 推导，避免「默认 DSL」被误当成「必须 fill_stream」。
 *
 * - fill_stream + prose_stream：正文类 string → prose 流式 + arg.append
 * - instant + structured：复杂 args → 主路径 bindTools/tool_call 产参，整包 tool.flush
 * - observation：无可执行 args → 不发 host_action
 *
 * 冲突时：required 含 object/array → 优先 instant（避免 locale 等旁路 string 抢走流式）。
 */
export type HostToolDeliveryProfile = 'fill_stream' | 'instant' | 'observation';

export type HostToolProduceMode = 'prose_stream' | 'structured';

export type HostToolDeliveryContract = {
  toolName: string;
  produceMode: HostToolProduceMode;
  delivery: HostToolDeliveryProfile;
  /** 仅 fill_stream 有值；instant / observation 为 null。 */
  streamablePath: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readProperties(
  argsSchema: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!isRecord(argsSchema)) {
    return null;
  }
  const properties = argsSchema.properties;
  if (!isRecord(properties) || Object.keys(properties).length === 0) {
    return null;
  }
  return properties;
}

function schemaTypeIsStructured(type: unknown): boolean {
  if (type === 'object' || type === 'array') {
    return true;
  }
  if (Array.isArray(type)) {
    return type.includes('object') || type.includes('array');
  }
  return false;
}

function propertyDefIsStructured(def: unknown): boolean {
  if (!isRecord(def)) {
    return false;
  }
  if (schemaTypeIsStructured(def.type)) {
    return true;
  }
  // 未写 type 但声明了 properties / items，仍视为结构化
  if (isRecord(def.properties) || def.items != null) {
    return true;
  }
  return false;
}

/** 优先正文键（text/content/…），不含任意 string 兜底——专供 fill_stream 判定。 */
export function pickHostToolProseStreamArgKey(
  properties: Record<string, unknown>,
): string | null {
  for (const key of HOST_TOOL_STRING_ARG_KEYS) {
    const def = properties[key];
    if (isRecord(def) && def.type === 'string') {
      return key;
    }
  }
  return null;
}

function hasStructuredProperty(properties: Record<string, unknown>): boolean {
  return Object.values(properties).some((def) => propertyDefIsStructured(def));
}

function requiredHasStructuredProperty(
  argsSchema: Record<string, unknown>,
  properties: Record<string, unknown>,
): boolean {
  const required = argsSchema.required;
  if (!Array.isArray(required)) {
    return false;
  }
  for (const key of required) {
    if (typeof key !== 'string' || key.length === 0) {
      continue;
    }
    if (propertyDefIsStructured(properties[key])) {
      return true;
    }
  }
  return false;
}

/** argsSchema 是否具备可 instant flush 的顶层 properties。 */
export function hostToolArgsSchemaIsStructured(
  argsSchema: Record<string, unknown> | null | undefined,
): boolean {
  const properties = readProperties(argsSchema);
  return properties != null && hasStructuredProperty(properties);
}

/**
 * 从单个 HostTool 定义推导交付契约（schema 真源；不读 env）。
 * HOST_TOOL_STREAM 只影响 fill_stream 是否 live append，不改变 instant 资格。
 */
export function resolveHostToolDeliveryContract(
  tool: HostToolDecisionDefinition,
): HostToolDeliveryContract {
  const properties = readProperties(tool.argsSchema);
  if (!properties) {
    return {
      toolName: tool.name,
      produceMode: 'prose_stream',
      delivery: 'observation',
      streamablePath: null,
    };
  }

  const prosePath = pickHostToolProseStreamArgKey(properties);
  const structured = hasStructuredProperty(properties);
  const requiredStructured = requiredHasStructuredProperty(
    tool.argsSchema,
    properties,
  );

  // required 含 object/array，或仅有结构化字段：instant（整包 flush）
  if (requiredStructured || (structured && !prosePath)) {
    return {
      toolName: tool.name,
      produceMode: 'structured',
      delivery: 'instant',
      streamablePath: null,
    };
  }

  // 正文类优先键 → fill_stream
  if (prosePath) {
    return {
      toolName: tool.name,
      produceMode: 'prose_stream',
      delivery: 'fill_stream',
      streamablePath: prosePath,
    };
  }

  // 非优先名的顶层 string（如 message）：仍可流式，避免观察态误伤
  const anyStringPath = pickHostToolStringArgKey(properties);
  if (anyStringPath && !structured) {
    return {
      toolName: tool.name,
      produceMode: 'prose_stream',
      delivery: 'fill_stream',
      streamablePath: anyStringPath,
    };
  }

  if (structured) {
    return {
      toolName: tool.name,
      produceMode: 'structured',
      delivery: 'instant',
      streamablePath: null,
    };
  }

  return {
    toolName: tool.name,
    produceMode: 'prose_stream',
    delivery: 'observation',
    streamablePath: null,
  };
}

export function resolveHostToolDeliveryContracts(input: {
  hostTools: HostToolDecisionDefinition[];
  allowedToolNames?: Set<string>;
}): HostToolDeliveryContract[] {
  const allowed = input.allowedToolNames;
  const out: HostToolDeliveryContract[] = [];
  for (const tool of input.hostTools) {
    if (allowed && !allowed.has(tool.name)) {
      continue;
    }
    out.push(resolveHostToolDeliveryContract(tool));
  }
  return out;
}

/** 契约上是否 DSL 交付（不含 env；fill_stream 仍可能被 HOST_TOOL_STREAM 关掉）。 */
export function hostToolContractDispatchesDsl(
  contract: HostToolDeliveryContract,
): boolean {
  return contract.delivery === 'fill_stream' || contract.delivery === 'instant';
}

/**
 * 当前运行时是否真的会发 host_action。
 * fill_stream 需 HOST_TOOL_STREAM；instant 始终可 flush。
 */
export function hostToolContractWillDispatchLive(
  contract: HostToolDeliveryContract,
  isStreamEnabled: boolean,
): boolean {
  if (contract.delivery === 'instant') {
    return true;
  }
  if (contract.delivery === 'fill_stream') {
    return isStreamEnabled;
  }
  return false;
}
