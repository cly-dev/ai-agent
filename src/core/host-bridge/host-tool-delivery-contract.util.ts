import type { HostToolDecisionDefinition } from './host-tool-decision.types';
import {
  HOST_TOOL_STRING_ARG_KEYS,
  pickHostToolStringArgKey,
} from './host-tool-string-arg.util';

/**
 * Host Tool 交付契约。
 *
 * - **B 端注册 HostTool（id > 0）**：一律 instant + structured（tool_call → tool.flush）
 * - **内置 / 伪工具（id === 0）**：仅用于 prose 展示锚点，可按 schema 走 fill_stream
 * - PageAction 总结流式不走 HostTool，见 page-action-prose-stream.util
 *
 * HOST_TOOL_STREAM 只影响 fill_stream 是否 live append，不改变 instant 资格。
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

/** B 端 HostTool 表注册的工具；与内置 page_action.show_result（id=0）区分。 */
export function isRegisteredHostTool(
  tool: Pick<HostToolDecisionDefinition, 'id'>,
): boolean {
  return Number.isInteger(tool.id) && tool.id > 0;
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
  if (isRecord(def.properties) || def.items != null) {
    return true;
  }
  return false;
}

/** 优先正文键（text/content/…），专供内置 fill_stream 判定。 */
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

function instantStructuredContract(
  tool: HostToolDecisionDefinition,
): HostToolDeliveryContract {
  return {
    toolName: tool.name,
    produceMode: 'structured',
    delivery: 'instant',
    streamablePath: null,
  };
}

/** argsSchema 是否走 instant flush（注册 HostTool 恒为 true）。 */
export function hostToolArgsSchemaIsStructured(
  argsSchema: Record<string, unknown> | null | undefined,
  toolId?: number,
): boolean {
  if (toolId != null && isRegisteredHostTool({ id: toolId })) {
    return true;
  }
  const properties = readProperties(argsSchema);
  return properties != null && hasStructuredProperty(properties);
}

/**
 * 从 HostTool 定义推导交付契约。
 * 注册 HostTool 不读 schema 形状；内置工具仍按 prose 键推断 fill_stream。
 */
export function resolveHostToolDeliveryContract(
  tool: HostToolDecisionDefinition,
): HostToolDeliveryContract {
  if (isRegisteredHostTool(tool)) {
    return instantStructuredContract(tool);
  }

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

  if (requiredStructured || (structured && !prosePath)) {
    return instantStructuredContract(tool);
  }

  if (prosePath) {
    return {
      toolName: tool.name,
      produceMode: 'prose_stream',
      delivery: 'fill_stream',
      streamablePath: prosePath,
    };
  }

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
    return instantStructuredContract(tool);
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

export function hostToolContractDispatchesDsl(
  contract: HostToolDeliveryContract,
): boolean {
  return contract.delivery === 'fill_stream' || contract.delivery === 'instant';
}

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
