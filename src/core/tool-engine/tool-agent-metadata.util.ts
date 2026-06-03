import {
  deriveDecisionRoleFromAgentMetadata,
  inferDecisionRoleFromHttpMethod,
  parseConfiguredToolDecisionRole,
  type ConfiguredToolDecisionRole,
  type ToolDecisionRole,
} from './tool-decision-role.enum';
import { parseResponseProfile } from './tool-output-projection.util';
import type { ToolResponseProfile } from './tool-response-profile.types';
import {
  OperationType,
  ResourceType,
  ToolMode,
  type AgentMetadata,
  type OperationType as Op,
  type ParsedUserToolIntent,
  type ResourceType as Res,
  type ToolMetadataSource,
} from './tool-agent-metadata.types';

const WRITE_INTENT_RE =
  /\b(create|update|delete|remove|save|submit|publish|unpublish|batch|set|adjust|enable|disable)\b/i;
const READ_INTENT_RE =
  /\b(get|search|find|list|detail|query|fetch|retrieve|show|view|count|status|price|inventory|stock|how many|what is)\b/i;

/** Language-neutral hints for list/search/filter reads (not tied to a locale). */
const READ_LIST_SEARCH_HINT_RE =
  /\b(list|lists|search|find|query|filter|where|which|all|any|multiple|page|pages|condition|criteria|less than|greater than|below|above|between|under|over)\b|<|>|<=|>=/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toUpperCase() as T;
  return allowed.includes(normalized) ? normalized : undefined;
}

/** 解析 Tool.agentMetadata；非法字段丢弃，缺省项补全。 */
export function parseAgentMetadata(raw: unknown): AgentMetadata | null {
  if (!isRecord(raw)) {
    return null;
  }
  const mode = pickEnum(raw.mode, Object.values(ToolMode));
  const resource = pickEnum(raw.resource, Object.values(ResourceType));
  const operation = pickEnum(raw.operation, Object.values(OperationType));
  if (!mode || !resource || !operation) {
    return null;
  }
  const businessFields = asStringArray(raw.businessFields);
  const aliases = asStringArray(raw.aliases);
  const examples = asStringArray(raw.examples);
  const priority =
    typeof raw.priority === 'number' && Number.isFinite(raw.priority)
      ? Math.round(raw.priority)
      : mode === ToolMode.WRITE
        ? 200
        : 100;
  const isMutation =
    typeof raw.isMutation === 'boolean' ? raw.isMutation : mode === ToolMode.WRITE;

  return {
    mode,
    resource,
    operation,
    businessFields,
    aliases,
    examples,
    priority,
    isMutation,
  };
}

/** 归一化并写回 isMutation。 */
export function normalizeAgentMetadata(raw: unknown): AgentMetadata | null {
  const parsed = parseAgentMetadata(raw);
  if (!parsed) {
    return null;
  }
  return {
    ...parsed,
    isMutation: parsed.mode === ToolMode.WRITE,
  };
}

function inferResourceFromText(text: string): Res {
  if (/\b(price|pricing|cost)\b/i.test(text)) {
    return ResourceType.PRICE;
  }
  if (/\b(inventory|stock)\b/i.test(text)) {
    return ResourceType.INVENTORY;
  }
  if (/\bseo\b/i.test(text)) {
    return ResourceType.SEO;
  }
  if (/\b(category|categories)\b/i.test(text)) {
    return ResourceType.CATEGORY;
  }
  if (/\b(collection|collections)\b/i.test(text)) {
    return ResourceType.COLLECTION;
  }
  if (/\b(order|orders)\b/i.test(text)) {
    return ResourceType.ORDER;
  }
  if (/\b(customer|customers)\b/i.test(text)) {
    return ResourceType.CUSTOMER;
  }
  return ResourceType.PRODUCT;
}

function inferOperationForRead(text: string): Op {
  if (/\b(stats?|statistics|metrics?|count)\b/i.test(text)) {
    return OperationType.STATS;
  }
  if (READ_LIST_SEARCH_HINT_RE.test(text)) {
    return OperationType.LIST;
  }
  return OperationType.DETAIL;
}

function inferBusinessFields(
  resource: Res,
  operation: Op,
  inputSchema: unknown,
): string[] {
  const fromSchema = extractRequiredParamNamesFromInputSchema(inputSchema);
  const mapped = fromSchema.map((name) => mapApiParamToBusinessField(name));
  const base: string[] = [];
  switch (resource) {
    case ResourceType.PRICE:
      if (operation === OperationType.UPDATE) {
        base.push('skuId', 'price');
      }
      break;
    case ResourceType.INVENTORY:
      if (operation === OperationType.UPDATE) {
        base.push('skuId', 'inventory');
      }
      break;
    case ResourceType.PRODUCT:
      if (
        operation === OperationType.DETAIL ||
        operation === OperationType.CREATE ||
        operation === OperationType.UPDATE
      ) {
        base.push('productId');
      }
      break;
    default:
      break;
  }
  return [...new Set([...base, ...mapped])].slice(0, 12);
}

function mapApiParamToBusinessField(param: string): string {
  const lower = param.toLowerCase();
  if (lower === 'id') {
    return 'productId';
  }
  if (lower.includes('skuid') || lower === 'sku') {
    return 'skuId';
  }
  if (lower.includes('price')) {
    return 'price';
  }
  if (lower.includes('inventory')) {
    return 'inventory';
  }
  return param;
}

function extractRequiredParamNamesFromInputSchema(inputSchema: unknown): string[] {
  if (!isRecord(inputSchema)) {
    return [];
  }
  const params = inputSchema.parameters;
  if (!Array.isArray(params)) {
    return [];
  }
  return params
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      if (item.required !== true) {
        return null;
      }
      const name = item.name;
      return typeof name === 'string' && name.trim() ? name.trim() : null;
    })
    .filter((name): name is string => name != null);
}

function inferAliases(resource: Res, description: string): string[] {
  const aliases: string[] = [];
  const desc = description.trim();
  if (desc) {
    aliases.push(desc);
  }
  switch (resource) {
    case ResourceType.PRICE:
      aliases.push('price', 'pricing', 'cost');
      break;
    case ResourceType.INVENTORY:
      aliases.push('inventory', 'stock');
      break;
    case ResourceType.PRODUCT:
      aliases.push('product', 'product detail', 'product info');
      break;
    default:
      break;
  }
  return [...new Set(aliases)].slice(0, 16);
}

/** Swagger：从 method、path、name、description 推断 agentMetadata。 */
export function inferAgentMetadataFromOpenApi(input: {
  method: string;
  path: string;
  name: string;
  description: string;
  inputSchema?: unknown;
}): AgentMetadata {
  const method = input.method.trim().toLowerCase();
  const text = `${input.name} ${input.description} ${input.path}`.toLowerCase();

  let mode: ToolMode = ToolMode.READ;
  if (/\b(cache|debug|test data|clear|purge)\b/i.test(text)) {
    mode = ToolMode.ADMIN;
  } else if (method === 'get') {
    mode = ToolMode.READ;
  } else {
    mode = ToolMode.WRITE;
  }

  const resource = inferResourceFromText(text);

  let operation: Op = OperationType.DETAIL;
  if (mode === ToolMode.ADMIN) {
    operation = OperationType.UPDATE;
  } else if (mode === ToolMode.READ) {
    operation = inferOperationForRead(text);
  } else if (method === 'post') {
    operation = OperationType.CREATE;
  } else if (method === 'delete') {
    operation = OperationType.DELETE;
  } else {
    operation = OperationType.UPDATE;
  }

  const businessFields = inferBusinessFields(resource, operation, input.inputSchema);
  const aliases = inferAliases(resource, input.description);
  const priority = mode === ToolMode.WRITE ? 200 : 100;

  return normalizeAgentMetadata({
    mode,
    resource,
    operation,
    businessFields,
    aliases,
    examples: [],
    priority,
    isMutation: mode === ToolMode.WRITE,
  })!;
}

/** 决策环 role：agentMetadata 推导 → responseProfile.decisionRole → HTTP。 */
export function resolveToolDecisionRole(source: ToolMetadataSource): ToolDecisionRole {
  const meta = parseAgentMetadata(source.agentMetadata);
  const fromMeta = deriveDecisionRoleFromAgentMetadata(meta);
  if (fromMeta) {
    return fromMeta;
  }
  if (isRecord(source.responseProfile)) {
    const explicit = parseConfiguredToolDecisionRole(
      source.responseProfile.decisionRole,
    );
    if (explicit) {
      return explicit;
    }
  }
  if (source.method) {
    const fromHttp = inferDecisionRoleFromHttpMethod(source.method);
    if (fromHttp) {
      return fromHttp;
    }
  }
  return 'unknown';
}

/** 从 responseProfile 提取 provides（path 或 label）供 compact 清单。 */
export function extractProvidesFromResponseProfile(
  responseProfile: unknown,
): string[] {
  const profile = parseResponseProfile(responseProfile);
  if (!profile) {
    return [];
  }
  const paths = [
    ...profile.coreFields.map((field) => field.label || field.path),
    ...(profile.optionalFields ?? []).slice(0, 6).map((field) => field.label || field.path),
  ];
  return [...new Set(paths.filter((item) => item.length > 0))].slice(0, 12);
}

function isListLikeOperation(operation: Op): boolean {
  return (
    operation === OperationType.LIST || operation === OperationType.SEARCH
  );
}

function operationsCompatible(intentOp: Op | undefined, metaOp: Op): boolean {
  if (!intentOp) {
    return true;
  }
  if (intentOp === metaOp) {
    return true;
  }
  return isListLikeOperation(intentOp) && isListLikeOperation(metaOp);
}

/** 规则化解析用户意图（mode / resource / operation）。 */
export function parseUserToolIntent(userMessage: string): ParsedUserToolIntent {
  const text = userMessage.trim();
  if (!text) {
    return {};
  }
  const intent: ParsedUserToolIntent = {};

  if (WRITE_INTENT_RE.test(text)) {
    intent.mode = ToolMode.WRITE;
  } else if (READ_INTENT_RE.test(text)) {
    intent.mode = ToolMode.READ;
  }

  if (intent.mode === ToolMode.READ && /\b(product|products|sku|item|items)\b/i.test(text)) {
    intent.resource = ResourceType.PRODUCT;
  } else if (/\b(price|pricing|cost)\b/i.test(text)) {
    intent.resource = ResourceType.PRICE;
  } else if (/\b(inventory|stock)\b/i.test(text)) {
    intent.resource = ResourceType.INVENTORY;
  } else if (/\b(remark|note|notes)\b/i.test(text)) {
    intent.resource = ResourceType.PRODUCT;
  }

  if (intent.mode === ToolMode.READ) {
    if (
      /\b(product|products)\b/i.test(text) &&
      (/\b(inventory|stock)\b/i.test(text) || READ_LIST_SEARCH_HINT_RE.test(text))
    ) {
      intent.resource = ResourceType.PRODUCT;
      intent.operation = OperationType.SEARCH;
    } else if (
      /\b(inventory|stock)\b/i.test(text) &&
      READ_LIST_SEARCH_HINT_RE.test(text)
    ) {
      intent.resource = ResourceType.PRODUCT;
      intent.operation = OperationType.SEARCH;
    } else if (/\b(stats?|statistics|count|metrics?)\b/i.test(text)) {
      intent.operation = OperationType.STATS;
    } else if (READ_LIST_SEARCH_HINT_RE.test(text)) {
      intent.operation = OperationType.SEARCH;
    } else if (/\b(list|lists)\b/i.test(text)) {
      intent.operation = OperationType.LIST;
    } else {
      intent.operation = OperationType.DETAIL;
    }
  }

  if (intent.mode === ToolMode.WRITE) {
    if (/\b(create|add|new)\b/i.test(text)) {
      intent.operation = OperationType.CREATE;
    } else if (/\b(delete|remove)\b/i.test(text)) {
      intent.operation = OperationType.DELETE;
    } else if (/\b(update|modify|set|adjust|change)\b/i.test(text)) {
      intent.operation = OperationType.UPDATE;
    }
  }

  return intent;
}

function metadataMatchesIntent(
  meta: AgentMetadata,
  intent: ParsedUserToolIntent,
  options?: { relaxOperation?: boolean },
): boolean {
  if (intent.mode && meta.mode !== intent.mode) {
    return false;
  }
  if (intent.resource && meta.resource !== intent.resource) {
    return false;
  }
  if (intent.operation && !options?.relaxOperation) {
    if (!operationsCompatible(intent.operation, meta.operation)) {
      return false;
    }
  }
  return true;
}

function filterWithIntent<T extends ToolMetadataSource>(
  withMeta: T[],
  intent: ParsedUserToolIntent,
  options?: { relaxOperation?: boolean },
): T[] {
  return withMeta.filter((tool) => {
    const meta = parseAgentMetadata(tool.agentMetadata);
    if (!meta) {
      return false;
    }
    return metadataMatchesIntent(meta, intent, options);
  });
}

/** 按 agentMetadata 过滤工具；过滤为空时回退原列表。 */
export function filterToolsByAgentMetadata<T extends ToolMetadataSource>(
  tools: T[],
  userMessage: string,
): T[] {
  const intent = parseUserToolIntent(userMessage);
  if (!intent.mode && !intent.resource && !intent.operation) {
    return sortToolsByMetadataPriority(tools);
  }

  const withMeta: T[] = [];
  const withoutMeta: T[] = [];
  for (const tool of tools) {
    const meta = parseAgentMetadata(tool.agentMetadata);
    if (meta) {
      withMeta.push(tool);
    } else {
      withoutMeta.push(tool);
    }
  }

  let matched = filterWithIntent(withMeta, intent);

  if (matched.length === 0 && intent.resource === ResourceType.INVENTORY) {
    const productSearchIntent: ParsedUserToolIntent = {
      ...intent,
      resource: ResourceType.PRODUCT,
      operation: intent.operation ?? OperationType.SEARCH,
    };
    matched = filterWithIntent(withMeta, productSearchIntent);
  }

  if (matched.length === 0) {
    matched = filterWithIntent(withMeta, intent, { relaxOperation: true });
  }

  if (matched.length > 0) {
    return sortToolsByMetadataPriority(matched);
  }
  if (withMeta.length > 0) {
    return sortToolsByMetadataPriority(withMeta);
  }
  return sortToolsByMetadataPriority(tools);
}

export function sortToolsByMetadataPriority<T extends ToolMetadataSource>(
  tools: T[],
): T[] {
  return [...tools].sort((a, b) => {
    const pa = parseAgentMetadata(a.agentMetadata)?.priority ?? 0;
    const pb = parseAgentMetadata(b.agentMetadata)?.priority ?? 0;
    return pb - pa;
  });
}

export function buildToolEmbedTextFromMetadata(tool: {
  name: string;
  description: string;
  agentMetadata?: unknown;
}): string {
  const meta = parseAgentMetadata(tool.agentMetadata);
  const parts = [tool.name.trim(), tool.description.trim()];
  if (meta) {
    parts.push(
      meta.mode,
      meta.resource,
      meta.operation,
      ...meta.aliases,
      ...meta.examples,
    );
  }
  return parts.filter((line) => line.length > 0).join('\n');
}

/** 将推导的 decisionRole 写入 responseProfile（保留既有 coreFields）。 */
export function mergeDecisionRoleIntoResponseProfile(
  responseProfile: unknown,
  agentMetadata: AgentMetadata | null,
  method: string,
): Record<string, unknown> {
  const base = isRecord(responseProfile) ? { ...responseProfile } : {};
  const role =
    deriveDecisionRoleFromAgentMetadata(agentMetadata) ??
    parseConfiguredToolDecisionRole(base.decisionRole) ??
    inferDecisionRoleFromHttpMethod(method);
  if (role) {
    base.decisionRole = role;
  }
  return base;
}

export function applyDecisionRoleToResponseProfile(
  profile: ToolResponseProfile,
  source: ToolMetadataSource,
): ToolResponseProfile {
  const role = resolveToolDecisionRole(source);
  if (role === 'unknown') {
    return profile;
  }
  return {
    ...profile,
    decisionRole: role as ConfiguredToolDecisionRole,
  };
}

export type ResolveInferredAgentMetadataInput = {
  method: string;
  path: string;
  toolName: string;
  toolDescription: string;
  inputSchema?: unknown;
  existingAgentMetadata?: unknown;
};

/**
 * LLM 推断 agentMetadata：优先合法 LLM 输出，否则 OpenAPI 启发式，最后保留已有配置。
 */
export function resolveInferredAgentMetadata(
  llmRaw: unknown,
  input: ResolveInferredAgentMetadataInput,
): { metadata: AgentMetadata; source: 'llm' | 'heuristic' | 'existing' } {
  const fromLlm = parseAgentMetadata(llmRaw);
  if (fromLlm) {
    return { metadata: fromLlm, source: 'llm' };
  }
  const existing = parseAgentMetadata(input.existingAgentMetadata);
  if (existing) {
    return { metadata: existing, source: 'existing' };
  }
  const heuristic = inferAgentMetadataFromOpenApi({
    method: input.method,
    path: input.path,
    name: input.toolName,
    description: input.toolDescription,
    inputSchema: input.inputSchema,
  });
  return { metadata: heuristic, source: 'heuristic' };
}
