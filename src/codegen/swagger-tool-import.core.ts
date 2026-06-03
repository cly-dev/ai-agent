import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import * as readline from 'readline/promises';
import {
  HttpMethod,
  IntegrationAuthMode,
  type PrismaClient,
  ToolLevel,
} from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { buildToolDefinitionKey } from '../common/tool/tool-definition-key.util';
import {
  inferAgentMetadataFromOpenApi,
  mergeDecisionRoleIntoResponseProfile,
  parseAgentMetadata,
} from '../core/tool-engine/tool-agent-metadata.util';
import {
  buildSwaggerImportResponseProfile,
  parseConfiguredToolDecisionRole,
} from '../core/tool-engine/tool-decision-role.enum';
import { buildPathFilter, matchesPathFilter } from './tool-path-filter.util';
import type { PathFilterConfig } from './tool-path-filter.util';

export type SwaggerOperationSelectionMode = 'interactive' | 'api-default-all';

export type SwaggerToolImportInput = {
  specUrl: string;
  specPath?: string;
  insecure?: boolean;
  integrationId?: number;
  appClientId?: number;
  agentId?: number | null;
  autoIntegration?: boolean;
  integrationName?: string;
  integrationBaseUrl?: string;
  integrationApiKey?: string;
  integrationAuthMode?: IntegrationAuthMode;
  dryRun?: boolean;
  tags?: string[];
  ops?: string[];
  pathInclude?: string[];
  pathExclude?: string[];
  noDefaultPathExclude?: boolean;
};

export type SwaggerToolImportResult = {
  integrationId: number;
  appClientId: number;
  agentId: number | null;
  operationCount: number;
  total: number;
  created: number;
  updated: number;
  dryRun: boolean;
  pathFilter: PathFilterConfig;
  toolIds: number[];
};

export type SwaggerToolApplyResult = {
  created: number;
  updated: number;
  toolIds: number[];
};

type HttpVerb = 'get' | 'post' | 'put' | 'patch' | 'delete';

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
};

type OpenApiPathItem = Partial<Record<HttpVerb, OpenApiOperation>>;

type OpenApiTagObject = {
  name?: string;
  description?: string;
};

type OpenApiDocument = {
  paths?: Record<string, OpenApiPathItem>;
  tags?: OpenApiTagObject[];
  info?: {
    title?: string;
  };
  servers?: Array<{
    url?: string;
  }>;
};

type ToolDraft = {
  definitionKey: string;
  name: string;
  description: string;
  method: HttpMethod;
  path: string;
  riskLevel: ToolLevel;
  schema: Prisma.InputJsonValue;
  inputSchema: Prisma.InputJsonValue;
  outputSchema: Prisma.InputJsonValue | null;
  agentMetadata: Prisma.InputJsonValue;
  /** 含 decisionRole（由 agentMetadata 推导）+ 占位 coreFields */
  responseProfile: Prisma.InputJsonValue;
  integrationId: number;
  isActive: boolean;
  /** OpenAPI 首个 tag，用于同步 ToolCategory */
  categoryLabel: string;
  /** 来自 spec 顶层 tags[].description（若有） */
  categoryDescription: string | null;
};

type OperationMeta = {
  key: string;
  method: HttpVerb;
  urlPath: string;
  tag: string;
  operation: OpenApiOperation;
};

/** CLI / API 统一内部上下文（与 swagger-tool-cli 参数对齐）。 */
export type SwaggerImportContext = {
  specPath?: string;
  specUrl: string;
  outputPath?: string;
  integrationId: number | null;
  appClientId: number | null;
  agentId: number | null;
  autoIntegration: boolean;
  integrationName?: string;
  integrationBaseUrl?: string;
  integrationApiKey: string;
  integrationAuthMode: IntegrationAuthMode;
  dryRun: boolean;
  apply: boolean;
  insecure: boolean;
  tags: Set<string>;
  ops: Set<string>;
  pathInclude: Set<string>;
  pathExclude: Set<string>;
  noDefaultPathExclude: boolean;
};

export const DEFAULT_SWAGGER_SPEC_URL =
  'https://api.ads.a-premium-test.com/v3/api-docs';
const ADMIN_ROLE_CANDIDATES = ['admin', 'super_admin'];
const OPERATOR_ROLE_CANDIDATES = ['operator'];
const HTTP_METHODS: HttpVerb[] = ['get', 'post', 'put', 'patch', 'delete'];
const METHOD_ENUM_MAP: Record<HttpVerb, HttpMethod> = {
  get: HttpMethod.Get,
  post: HttpMethod.Post,
  put: HttpMethod.Put,
  patch: HttpMethod.Put,
  delete: HttpMethod.Delete,
};

/** 按 HTTP 动词推导 Tool 风险等级：GET=L1，POST/PUT/PATCH=L2，DELETE=L3。 */
export function resolveRiskLevelByHttpVerb(method: HttpVerb): ToolLevel {
  switch (method) {
    case 'get':
      return ToolLevel.L1;
    case 'post':
    case 'put':
    case 'patch':
      return ToolLevel.L2;
    case 'delete':
      return ToolLevel.L3;
    default:
      return ToolLevel.L1;
  }
}

export function toSwaggerImportContext(
  input: SwaggerToolImportInput,
): SwaggerImportContext {
  const specUrl = input.specUrl.trim();
  if (!specUrl && !input.specPath?.trim()) {
    throw new Error('specUrl or specPath is required');
  }
  if (!input.autoIntegration && input.integrationId == null) {
    throw new Error(
      'integrationId is required when autoIntegration is disabled',
    );
  }
  const dryRun = input.dryRun ?? false;
  return {
    specPath: input.specPath?.trim() || undefined,
    specUrl: specUrl || DEFAULT_SWAGGER_SPEC_URL,
    integrationId: input.integrationId ?? null,
    appClientId: input.appClientId ?? null,
    agentId: input.agentId ?? null,
    autoIntegration: input.autoIntegration ?? false,
    integrationName: input.integrationName,
    integrationBaseUrl: input.integrationBaseUrl,
    integrationApiKey: input.integrationApiKey?.trim() ?? '',
    integrationAuthMode:
      input.integrationAuthMode ?? IntegrationAuthMode.USER_PREFERRED,
    dryRun,
    apply: !dryRun,
    insecure: input.insecure ?? false,
    tags: new Set((input.tags ?? []).map((item) => item.trim()).filter(Boolean)),
    ops: new Set((input.ops ?? []).map((item) => item.trim()).filter(Boolean)),
    pathInclude: new Set(
      (input.pathInclude ?? []).map((item) => item.trim()).filter(Boolean),
    ),
    pathExclude: new Set(
      (input.pathExclude ?? []).map((item) => item.trim()).filter(Boolean),
    ),
    noDefaultPathExclude: input.noDefaultPathExclude ?? false,
  };
}

export function resolveIntegrationAuthMode(
  raw: string | undefined,
): IntegrationAuthMode {
  const mode = (raw ?? 'USER_PREFERRED').trim().toUpperCase();
  if (
    mode !== 'USER_ONLY' &&
    mode !== 'SYSTEM_ONLY' &&
    mode !== 'USER_PREFERRED'
  ) {
    throw new Error(
      'integration auth mode must be one of: USER_ONLY, SYSTEM_ONLY, USER_PREFERRED',
    );
  }
  return mode as IntegrationAuthMode;
}

function resolvePathFilter(options: SwaggerImportContext): PathFilterConfig {
  return buildPathFilter({
    include: options.pathInclude,
    exclude: options.pathExclude,
    useDefaultExclude: !options.noDefaultPathExclude,
  });
}

function hasExplicitPathInclude(options: SwaggerImportContext): boolean {
  return options.pathInclude.size > 0;
}

function opKey(method: HttpVerb, urlPath: string): string {
  return `${method.toUpperCase()}:${urlPath}`;
}

function normalizeOpSelector(raw: string): string {
  const parts = raw.split(':');
  if (parts.length !== 2) {
    throw new Error(`invalid op selector: ${raw}. expected METHOD:/path`);
  }
  const method = parts[0].trim().toUpperCase();
  const methodSet = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  if (!methodSet.has(method)) {
    throw new Error(`invalid method in op selector: ${raw}`);
  }
  const urlPath = normalizePath(parts[1].trim());
  return `${method}:${urlPath}`;
}

function normalizePath(urlPath: string): string {
  if (urlPath.startsWith('/')) {
    return urlPath;
  }
  return `/${urlPath}`;
}

function buildToolName(
  operation: OpenApiOperation,
  method: HttpVerb,
  urlPath: string,
): string {
  const raw = operation.operationId?.trim();
  if (raw) {
    return raw;
  }
  return `${method}_${urlPath.replace(/\W+/g, '_').replace(/^_+|_+$/g, '')}`;
}

function buildDescription(
  operation: OpenApiOperation,
  method: HttpVerb,
  urlPath: string,
): string {
  return (
    operation.summary?.trim() ??
    operation.description?.trim() ??
    `${method.toUpperCase()} ${urlPath}`
  );
}

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

const SPEC_DOWNLOAD_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const SPEC_DOWNLOAD_TIMEOUT_MS = 120_000;
const SPEC_DOWNLOAD_MAX_REDIRECTS = 10;
const SPEC_DOWNLOAD_MAX_ATTEMPTS = 3;
const SPEC_DOWNLOAD_RETRY_BASE_MS = 600;

function headerLocation(headers: http.IncomingHttpHeaders): string | undefined {
  const raw = headers['location'];
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

function isTransientNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const code = (err as NodeJS.ErrnoException).code;
  if (typeof code === 'string') {
    return (
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      code === 'EPIPE' ||
      code === 'ENETUNREACH' ||
      code === 'EAI_AGAIN'
    );
  }
  return false;
}

type UrlFetchResult = {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
};

function requestUrlOnce(
  urlString: string,
  insecure: boolean,
): Promise<UrlFetchResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const target = new URL(urlString);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      reject(new Error(`unsupported URL protocol: ${target.protocol}`));
      return;
    }
    const isHttps = target.protocol === 'https:';
    const lib = isHttps ? https : http;
    const defaultPort = isHttps ? 443 : 80;
    const options: https.RequestOptions = {
      hostname: target.hostname,
      port: target.port || defaultPort,
      path: `${target.pathname}${target.search}`,
      method: 'GET',
      headers: {
        Accept: 'application/json, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': SPEC_DOWNLOAD_USER_AGENT,
      },
    };
    if (isHttps) {
      options.rejectUnauthorized = !insecure;
    }

    const req = lib.request(options, (incoming) => {
      const statusCode = incoming.statusCode ?? 0;
      const headers = incoming.headers;

      if (statusCode >= 300 && statusCode < 400 && headerLocation(headers)) {
        incoming.resume();
        settled = true;
        resolve({ statusCode, headers, body: '' });
        return;
      }

      if (!statusCode || statusCode >= 400) {
        incoming.resume();
        settled = true;
        resolve({ statusCode, headers, body: '' });
        return;
      }

      let body = '';
      incoming.setEncoding('utf-8');
      incoming.on('data', (chunk: string) => {
        body += chunk;
      });
      incoming.on('end', () => {
        settled = true;
        resolve({ statusCode, headers, body });
      });
    });

    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    req.setTimeout(SPEC_DOWNLOAD_TIMEOUT_MS, () => {
      req.destroy();
      if (!settled) {
        settled = true;
        reject(new Error('request timeout'));
      }
    });

    req.end();
  });
}

async function loadSpecFromRemoteUrl(
  initialUrl: string,
  insecure: boolean,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < SPEC_DOWNLOAD_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      const delay = SPEC_DOWNLOAD_RETRY_BASE_MS * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }

    let currentUrl = initialUrl;
    try {
      for (let hop = 0; hop < SPEC_DOWNLOAD_MAX_REDIRECTS; hop += 1) {
        const res = await requestUrlOnce(currentUrl, insecure);
        const { statusCode, headers } = res;

        const nextLocation = headerLocation(headers);
        if (statusCode >= 300 && statusCode < 400 && nextLocation) {
          currentUrl = new URL(nextLocation, currentUrl).toString();
          continue;
        }

        if (!statusCode || statusCode >= 400) {
          throw new Error(
            `failed to download spec: HTTP ${statusCode || 'unknown'}`,
          );
        }

        return res.body;
      }
      throw new Error(
        `too many redirects (max ${SPEC_DOWNLOAD_MAX_REDIRECTS})`,
      );
    } catch (err) {
      lastErr = err;
      const retriable =
        isTransientNetworkError(err) ||
        (err instanceof Error && err.message === 'request timeout');
      if (retriable && attempt < SPEC_DOWNLOAD_MAX_ATTEMPTS - 1) {
        continue;
      }
      if (isTransientNetworkError(err)) {
        const code = (err as NodeJS.ErrnoException).code;
        throw new Error(
          `download spec failed (${code ?? 'network'}): ${
            err instanceof Error ? err.message : String(err)
          }. try: --insecure (TLS), retry, or curl the URL to --spec-path`,
        );
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function loadOpenApiSpec(
  options: SwaggerImportContext,
): Promise<OpenApiDocument> {
  const raw = options.specPath
    ? fs.readFileSync(path.resolve(process.cwd(), options.specPath), 'utf-8')
    : await loadSpecFromRemoteUrl(options.specUrl, options.insecure);
  const parsed = JSON.parse(raw) as OpenApiDocument;
  if (!parsed.paths || typeof parsed.paths !== 'object') {
    throw new Error('invalid openapi spec: missing paths');
  }
  return parsed;
}

function operationPrimaryTag(operation: OpenApiOperation): string {
  return operation.tags?.[0]?.trim() || 'misc';
}

function buildTagDescriptionMap(spec: OpenApiDocument): Map<string, string> {
  const map = new Map<string, string>();
  const rootTags = spec.tags;
  if (!Array.isArray(rootTags)) {
    return map;
  }
  for (const item of rootTags) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const desc =
      typeof item.description === 'string' ? item.description.trim() : '';
    if (name && desc) {
      map.set(name, desc);
    }
  }
  return map;
}

function listOperations(
  spec: OpenApiDocument,
  pathFilter: PathFilterConfig,
): OperationMeta[] {
  const items: OperationMeta[] = [];
  for (const [urlPath, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!matchesPathFilter(urlPath, pathFilter)) {
      continue;
    }
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }
      items.push({
        key: opKey(method, urlPath),
        method,
        urlPath,
        tag: operationPrimaryTag(operation),
        operation,
      });
    }
  }
  items.sort((a, b) => {
    const tagCmp = a.tag.localeCompare(b.tag);
    if (tagCmp !== 0) {
      return tagCmp;
    }
    const pathCmp = a.urlPath.localeCompare(b.urlPath);
    if (pathCmp !== 0) {
      return pathCmp;
    }
    return a.method.localeCompare(b.method);
  });
  return items;
}

function parseIndexSelection(input: string, max: number): Set<number> {
  const value = input.trim();
  if (/^(all|\*)$/i.test(value)) {
    return new Set(Array.from({ length: max }, (_, idx) => idx + 1));
  }
  const selected = new Set<number>();
  for (const part of value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)) {
    if (/^\d+\s*-\s*\d+$/.test(part)) {
      const [start, end] = part.split('-').map((item) => Number(item.trim()));
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end > max ||
        start > end
      ) {
        throw new Error(`invalid range: ${part}`);
      }
      for (let i = start; i <= end; i += 1) {
        selected.add(i);
      }
    } else {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 1 || index > max) {
        throw new Error(`invalid index: ${part}`);
      }
      selected.add(index);
    }
  }
  if (selected.size === 0) {
    throw new Error('no operations selected');
  }
  return selected;
}

async function promptSelectOperationKeys(
  operations: OperationMeta[],
): Promise<Set<string>> {
  // eslint-disable-next-line no-console
  console.log('\nSwagger directories (grouped by tag):');
  let currentTag = '';
  const indexToKey = new Map<number, string>();
  let idx = 0;
  for (const item of operations) {
    if (item.tag !== currentTag) {
      currentTag = item.tag;
      // eslint-disable-next-line no-console
      console.log(`\n- ${currentTag}`);
    }
    idx += 1;
    indexToKey.set(idx, item.key);
    const summary = item.operation.summary?.trim();
    // eslint-disable-next-line no-console
    console.log(
      `  ${idx}. [${item.method.toUpperCase()}] ${item.urlPath}${
        summary ? ` - ${summary}` : ''
      }`,
    );
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question(
      '\nSelect operations (e.g. 1,3,5-8 or all): ',
    );
    const indexes = parseIndexSelection(answer, operations.length);
    const keys = new Set<string>();
    for (const index of indexes) {
      const key = indexToKey.get(index);
      if (key) {
        keys.add(key);
      }
    }
    return keys;
  } finally {
    rl.close();
  }
}

export async function resolveSelectedOperationKeys(
  options: SwaggerImportContext,
  operations: OperationMeta[],
  selectionMode: SwaggerOperationSelectionMode,
): Promise<Set<string>> {
  const allKeys = new Set(operations.map((item) => item.key));
  if (options.ops.size > 0) {
    const selected = new Set<string>();
    for (const raw of options.ops) {
      const normalized = normalizeOpSelector(raw);
      if (!allKeys.has(normalized)) {
        throw new Error(`operation not found in spec: ${normalized}`);
      }
      selected.add(normalized);
    }
    return selected;
  }

  if (options.tags.size > 0) {
    const availableTags = new Set(operations.map((item) => item.tag));
    for (const tag of options.tags) {
      if (!availableTags.has(tag)) {
        throw new Error(`tag not found in spec: ${tag}`);
      }
    }
    return new Set(
      operations
        .filter((item) => options.tags.has(item.tag))
        .map((item) => item.key),
    );
  }

  if (hasExplicitPathInclude(options)) {
    if (operations.length === 0) {
      throw new Error('no operations matched --path-include / path-exclude filters');
    }
    return new Set(operations.map((item) => item.key));
  }

  if (selectionMode === 'api-default-all') {
    if (operations.length === 0) {
      throw new Error('no operations matched path filters');
    }
    return new Set(operations.map((item) => item.key));
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'interactive selection requires TTY. use --tags, --ops, or --path-include in non-interactive mode',
    );
  }

  return promptSelectOperationKeys(operations);
}

export async function promptSwaggerSpecUrl(
  defaultUrl: string,
): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question(
      `\n请输入 tools 文档地址（Swagger URL，回车使用默认值 ${defaultUrl}）: `,
    );
    const value = answer.trim();
    return value || defaultUrl;
  } finally {
    rl.close();
  }
}

function buildToolDrafts(
  spec: OpenApiDocument,
  pathFilter: PathFilterConfig,
  selectedKeys: Set<string>,
  integrationId: number,
): ToolDraft[] {
  const tagDescriptions = buildTagDescriptionMap(spec);
  const drafts: ToolDraft[] = [];
  for (const [urlPath, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!matchesPathFilter(urlPath, pathFilter)) {
      continue;
    }
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }
      if (!selectedKeys.has(opKey(method, urlPath))) {
        continue;
      }

      const inputSchema = toInputJsonValue({
        parameters: operation.parameters ?? [],
        requestBody: operation.requestBody ?? null,
      });
      const outputSchema: Prisma.InputJsonValue | null = operation.responses
        ? toInputJsonValue(operation.responses)
        : null;

      const categoryLabel = operationPrimaryTag(operation);
      const categoryDescription = tagDescriptions.get(categoryLabel) ?? null;
      const name = buildToolName(operation, method, urlPath);
      const agentMetadata = inferAgentMetadataFromOpenApi({
        method,
        path: normalizePath(urlPath),
        name,
        description: buildDescription(operation, method, urlPath),
        inputSchema,
      });

      drafts.push({
        definitionKey: buildToolDefinitionKey({
          categoryLabel,
          method,
          path: normalizePath(urlPath),
          name,
          operationId: operation.operationId,
        }),
        name,
        description: buildDescription(operation, method, urlPath),
        method: METHOD_ENUM_MAP[method],
        path: normalizePath(urlPath),
        riskLevel: resolveRiskLevelByHttpVerb(method),
        schema: inputSchema,
        inputSchema,
        outputSchema,
        agentMetadata: agentMetadata as unknown as Prisma.InputJsonValue,
        responseProfile: mergeDecisionRoleIntoResponseProfile(
          buildSwaggerImportResponseProfile(method, agentMetadata),
          agentMetadata,
          method,
        ) as Prisma.InputJsonValue,
        integrationId,
        isActive: true,
        categoryLabel,
        categoryDescription,
      });
    }
  }
  return drafts;
}

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('integration base url cannot be empty');
  }
  const parsed = new URL(trimmed);
  const pathname =
    parsed.pathname && parsed.pathname !== '/'
      ? parsed.pathname.replace(/\/+$/g, '')
      : '';
  return `${parsed.origin}${pathname}`;
}

function resolveIntegrationBaseUrl(
  options: SwaggerImportContext,
  spec: OpenApiDocument,
): string {
  if (options.integrationBaseUrl) {
    return normalizeBaseUrl(options.integrationBaseUrl);
  }
  const firstServer = spec.servers?.[0]?.url;
  if (firstServer && firstServer.trim()) {
    return normalizeBaseUrl(firstServer);
  }
  return normalizeBaseUrl(options.specUrl);
}

function resolveIntegrationName(
  options: SwaggerImportContext,
  spec: OpenApiDocument,
): string {
  const value =
    options.integrationName?.trim() ??
    spec.info?.title?.trim() ??
    'swagger-integration';
  return value.length > 0 ? value : 'swagger-integration';
}

export async function resolveIntegrationId(
  prisma: PrismaClient,
  options: SwaggerImportContext,
  spec: OpenApiDocument,
): Promise<number> {
  if (!options.autoIntegration) {
    if (options.integrationId === null) {
      throw new Error(
        'integration-id is required when auto-integration is disabled',
      );
    }
    return options.integrationId;
  }
  if (options.appClientId === null) {
    const fallbackAppClient = await prisma.appClient.findFirst({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    if (!fallbackAppClient) {
      throw new Error(
        'app-client-id is required when auto-integration is enabled and no appClient exists',
      );
    }
    options.appClientId = fallbackAppClient.id;
    // eslint-disable-next-line no-console
    console.log(
      `auto selected appClient: ${fallbackAppClient.id} (${fallbackAppClient.name})`,
    );
  }
  const baseUrl = resolveIntegrationBaseUrl(options, spec);
  const name = resolveIntegrationName(options, spec);
  const existing = await prisma.integration.findFirst({
    where: {
      appClientId: options.appClientId,
      baseUrl,
    },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  if (existing) {
    return existing.id;
  }
  const created = await prisma.integration.create({
    data: {
      appClientId: options.appClientId,
      name,
      baseUrl,
      apiKey: options.integrationApiKey,
      authMode: options.integrationAuthMode,
    },
    select: { id: true },
  });
  return created.id;
}

async function promptSelectAgentId(
  agents: Array<{ id: number; name: string }>,
): Promise<number> {
  // eslint-disable-next-line no-console
  console.log('\nAvailable agents under current appClient:');
  for (const agent of agents) {
    // eslint-disable-next-line no-console
    console.log(`  ${agent.id}. ${agent.name}`);
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question('\nSelect target agent id to bind tools: ');
    const selected = Number(answer.trim());
    if (!Number.isInteger(selected) || selected <= 0) {
      throw new Error('invalid agent id');
    }
    const exists = agents.some((item) => item.id === selected);
    if (!exists) {
      throw new Error(`agent id ${selected} not found in current appClient`);
    }
    return selected;
  } finally {
    rl.close();
  }
}

export async function resolveTargetAgentId(
  prisma: PrismaClient,
  options: SwaggerImportContext,
  appClientId: number,
  selectionMode: SwaggerOperationSelectionMode,
): Promise<number | null> {
  if (options.agentId !== null) {
    const exists = await prisma.agent.findFirst({
      where: { id: options.agentId, appClientId },
      select: { id: true },
    });
    if (!exists) {
      throw new Error(
        `agent ${options.agentId} not found under appClient ${appClientId}`,
      );
    }
    return options.agentId;
  }
  if (selectionMode === 'api-default-all') {
    return null;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return null;
  }
  const agents = await prisma.agent.findMany({
    where: { appClientId },
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });
  if (agents.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      `no agents found under appClient ${appClientId}, skip agent binding`,
    );
    return null;
  }
  return promptSelectAgentId(agents);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 更新已有 Tool 时合并 agentMetadata / decisionRole，不覆盖已有 coreFields。 */
function mergeAgentMetadataForSwaggerImport(
  existing: unknown,
  incoming: Prisma.InputJsonValue,
): Prisma.InputJsonValue {
  if (!isRecord(existing) || !parseAgentMetadata(existing)) {
    return incoming;
  }
  return existing as Prisma.InputJsonValue;
}

function mergeResponseProfileForSwaggerImport(
  existing: unknown,
  incoming: Prisma.InputJsonValue,
  agentMetadata: ReturnType<typeof inferAgentMetadataFromOpenApi> | null,
  method: string,
): Prisma.InputJsonValue {
  const incomingRecord = incoming as Record<string, unknown>;
  if (!isRecord(existing)) {
    return incoming;
  }
  let merged: Record<string, unknown> = { ...existing };
  if (!parseConfiguredToolDecisionRole(existing.decisionRole)) {
    merged.decisionRole = incomingRecord.decisionRole;
  }
  const existingCore = existing.coreFields;
  const hasCore =
    Array.isArray(existingCore) && existingCore.length > 0;
  if (!hasCore && Array.isArray(incomingRecord.coreFields)) {
    merged.coreFields = incomingRecord.coreFields;
  }
  merged = mergeDecisionRoleIntoResponseProfile(merged, agentMetadata, method);
  return merged as Prisma.InputJsonValue;
}

function draftToToolWriteData(
  draft: ToolDraft,
  toolCategoryId: number,
  appClientId: number,
): Prisma.ToolCreateInput {
  return {
    definitionKey: draft.definitionKey,
    name: draft.name,
    description: draft.description,
    riskLevel: draft.riskLevel,
    schema: draft.schema,
    inputSchema: draft.inputSchema,
    outputSchema: draft.outputSchema,
    agentMetadata: draft.agentMetadata,
    responseProfile: draft.responseProfile,
    method: draft.method,
    path: draft.path,
    integration: { connect: { id: draft.integrationId } },
    appClient: { connect: { id: appClientId } },
    toolCategory: { connect: { id: toolCategoryId } },
    isActive: draft.isActive,
  };
}

async function ensureToolCategoriesByDrafts(
  prisma: PrismaClient,
  drafts: ToolDraft[],
): Promise<Map<string, number>> {
  const labelToDescription = new Map<string, string | null>();
  for (const draft of drafts) {
    if (!labelToDescription.has(draft.categoryLabel)) {
      labelToDescription.set(draft.categoryLabel, draft.categoryDescription);
    }
  }

  const idByLabel = new Map<string, number>();
  for (const [label, specDescription] of labelToDescription) {
    let row = await prisma.toolCategory.findFirst({
      where: { label },
    });
    if (!row) {
      row = await prisma.toolCategory.create({
        data: {
          label,
          description: specDescription,
        },
      });
    } else if (specDescription && !row.description) {
      row = await prisma.toolCategory.update({
        where: { id: row.id },
        data: { description: specDescription },
      });
    }
    idByLabel.set(label, row.id);
  }
  return idByLabel;
}

export async function applyTools(
  prisma: PrismaClient,
  drafts: ToolDraft[],
  targetAgentId: number | null,
): Promise<SwaggerToolApplyResult> {
  const categoryIdByLabel = await ensureToolCategoriesByDrafts(prisma, drafts);
  const allRoles = await prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });
  if (allRoles.length === 0) {
    throw new Error('no roles found, cannot bind tool permissions');
  }

  let created = 0;
  let updated = 0;
  const toolIds: number[] = [];

  for (const draft of drafts) {
    const toolCategoryId = categoryIdByLabel.get(draft.categoryLabel);
    if (toolCategoryId === undefined) {
      throw new Error(
        `missing tool category id for label: ${draft.categoryLabel}`,
      );
    }
    const integration = await prisma.integration.findUnique({
      where: { id: draft.integrationId },
      select: { appClientId: true },
    });
    if (!integration) {
      throw new Error(`integration ${draft.integrationId} not found`);
    }
    const toolData = draftToToolWriteData(
      draft,
      toolCategoryId,
      integration.appClientId,
    );
    const existing = await prisma.tool.findFirst({
      where: {
        appClientId: integration.appClientId,
        definitionKey: draft.definitionKey,
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        responseProfile: true,
        agentMetadata: true,
      },
    });
    let toolId: number;
    if (existing) {
      await prisma.tool.update({
        where: { id: existing.id },
        data: {
          definitionKey: toolData.definitionKey,
          name: toolData.name,
          description: toolData.description,
          riskLevel: toolData.riskLevel,
          schema: toolData.schema,
          inputSchema: toolData.inputSchema,
          outputSchema: toolData.outputSchema,
          agentMetadata: mergeAgentMetadataForSwaggerImport(
            existing.agentMetadata,
            draft.agentMetadata,
          ),
          responseProfile: mergeResponseProfileForSwaggerImport(
            existing.responseProfile,
            draft.responseProfile,
            parseAgentMetadata(existing.agentMetadata) ??
              parseAgentMetadata(draft.agentMetadata),
            String(draft.method),
          ),
          isActive: toolData.isActive,
          toolCategory: toolData.toolCategory,
          method: draft.method,
          path: draft.path,
          integration: toolData.integration,
        },
      });
      toolId = existing.id;
      updated += 1;
    } else {
      const createdRow = await prisma.tool.create({
        data: toolData,
        select: { id: true },
      });
      toolId = createdRow.id;
      created += 1;
    }
    toolIds.push(toolId);
    const allowedRoleIds = resolveAllowedRoleIdsByMethod(
      draft.method,
      allRoles,
    );
    await syncRoleToolBindings(prisma, toolId, allowedRoleIds);
    if (targetAgentId !== null) {
      await prisma.agentTool.upsert({
        where: {
          agentId_toolId: {
            agentId: targetAgentId,
            toolId,
          },
        },
        create: {
          agentId: targetAgentId,
          toolId,
        },
        update: {},
      });
    }
  }

  return { created, updated, toolIds };
}

function resolveAllowedRoleIdsByMethod(
  method: HttpMethod,
  roles: Array<{ id: number; name: string }>,
): number[] {
  if (method === HttpMethod.Get) {
    return roles.map((item) => item.id);
  }

  const normalizedRoles = roles.map((item) => ({
    id: item.id,
    name: item.name.trim().toLowerCase(),
  }));
  const adminRoleIds = normalizedRoles
    .filter((item) => ADMIN_ROLE_CANDIDATES.includes(item.name))
    .map((item) => item.id);
  if (adminRoleIds.length === 0) {
    throw new Error(
      `admin role not found. expected one of: ${ADMIN_ROLE_CANDIDATES.join(
        ', ',
      )}`,
    );
  }
  if (method === HttpMethod.Delete) {
    return adminRoleIds;
  }

  const operatorRoleIds = normalizedRoles
    .filter((item) => OPERATOR_ROLE_CANDIDATES.includes(item.name))
    .map((item) => item.id);
  if (operatorRoleIds.length === 0) {
    throw new Error(
      `operator role not found. expected one of: ${OPERATOR_ROLE_CANDIDATES.join(
        ', ',
      )}`,
    );
  }
  if (method === HttpMethod.Post || method === HttpMethod.Put) {
    return Array.from(new Set([...adminRoleIds, ...operatorRoleIds]));
  }

  return roles.map((item) => item.id);
}

async function syncRoleToolBindings(
  prisma: PrismaClient,
  toolId: number,
  allowedRoleIds: number[],
): Promise<void> {
  if (allowedRoleIds.length === 0) {
    throw new Error(`no allowed roles resolved for tool ${toolId}`);
  }
  await prisma.roleTool.deleteMany({
    where: {
      toolId,
      roleId: { notIn: allowedRoleIds },
    },
  });
  for (const roleId of allowedRoleIds) {
    await prisma.roleTool.upsert({
      where: {
        roleId_toolId: {
          roleId,
          toolId,
        },
      },
      create: { roleId, toolId },
      update: {},
    });
  }
}

export { listOperations, buildToolDrafts };

export async function importSwaggerTools(
  prisma: PrismaClient,
  input: SwaggerToolImportInput,
  selectionMode: SwaggerOperationSelectionMode,
): Promise<SwaggerToolImportResult> {
  const ctx = toSwaggerImportContext(input);
  const spec = await loadOpenApiSpec(ctx);
  const integrationId = await resolveIntegrationId(prisma, ctx, spec);
  const integration = await prisma.integration.findUnique({
    where: { id: integrationId },
    select: { appClientId: true },
  });
  if (!integration) {
    throw new Error(`integration ${integrationId} not found`);
  }
  const targetAgentId = await resolveTargetAgentId(
    prisma,
    ctx,
    integration.appClientId,
    selectionMode,
  );
  const pathFilter = resolvePathFilter(ctx);
  const operations = listOperations(spec, pathFilter);
  const selectedKeys = await resolveSelectedOperationKeys(
    ctx,
    operations,
    selectionMode,
  );
  const drafts = buildToolDrafts(
    spec,
    pathFilter,
    selectedKeys,
    integrationId,
  );
  if (drafts.length === 0) {
    throw new Error('no operations matched filters');
  }

  let created = 0;
  let updated = 0;
  let toolIds: number[] = [];
  if (ctx.apply) {
    const applied = await applyTools(prisma, drafts, targetAgentId);
    created = applied.created;
    updated = applied.updated;
    toolIds = applied.toolIds;
  }

  return {
    integrationId,
    appClientId: integration.appClientId,
    agentId: targetAgentId,
    operationCount: operations.length,
    total: drafts.length,
    created,
    updated,
    dryRun: ctx.dryRun,
    pathFilter,
    toolIds,
  };
}
